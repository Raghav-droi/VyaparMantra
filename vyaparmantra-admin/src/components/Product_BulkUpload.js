import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
} from '@mui/material';
import { collection, addDoc, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

const ProductBulkUpload = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [wholesalerId, setWholesalerId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [wholesalers, setWholesalers] = useState([]);
  const [failedProducts, setFailedProducts] = useState([]);
  const [failedPage, setFailedPage] = useState(1);
  const failedPerPage = 10; // Number of failed products per page

  useEffect(() => {
    const fetchWholesalers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'wholesaler'));
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          name:
            doc.data().tradeName ||
            doc.data().businessOwnerName ||
            doc.id,
        }));
        setWholesalers(list);
      } catch (err) {
        setMessage('Error fetching wholesalers');
      }
    };
    fetchWholesalers();
  }, []);

  const handleFileChange = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const handleDownloadTemplate = () => {
    const csvHeader = 'productId,name,category,description,imageUrl,unit,pricePerUnit,stock,priceRanges\n';
    const blob = new Blob([csvHeader], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadFailed = () => {
    if (!failedProducts.length) return;
    const csv = Papa.unparse(failedProducts);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, 'failed_products.csv');
  };

  const fetchAllowedValues = async () => {
    const snap = await getDoc(doc(db, 'system_settings', 'product_field_settings'));
    return snap.exists() ? snap.data() : { units: [], categories: [] };
  };

  const handleUpload = async () => {
    const { units: allowedUnits, categories: allowedCategories } = await fetchAllowedValues();
    if (!csvFile || !wholesalerId) {
      setMessage('Please select a wholesaler and CSV file.');
      return;
    }
    setUploading(true);
    setMessage('');

    // Get wholesaler info for top-level product reference
    const selectedWholesaler = wholesalers.find(w => w.id === wholesalerId);
    const wholesalerName = selectedWholesaler?.name || wholesalerId;

    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        const products = results.data;
        if (products.length > 200) {
          setMessage('Error: You cannot upload more than 200 products in one file.');
          setUploading(false);
          return;
        }
        let successCount = 0;
        let errorCount = 0;
        let failedRows = [];
        for (const product of products) {
          let errors = [];

          // Validate required fields
          if (!product.productId) errors.push('Missing productId');
          if (!product.name) errors.push('Missing name');
          if (!product.category) errors.push('Missing category');
          if (!product.unit) errors.push('Missing unit');
          if (!product.pricePerUnit) errors.push('Missing pricePerUnit');
          if (!product.stock) errors.push('Missing stock');

          // Validate category
          if (
            typeof product.category !== 'string' ||
            !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(product.category.trim()) ||
            !allowedCategories.includes(product.category.trim().toUpperCase())
          ) {
            errors.push(`Category "${product.category}" is not allowed or invalid format`);
          }

          // Validate description
          if (
            product.description &&
            !/^[A-Za-z0-9\s.,'-]*$/.test(product.description)
          ) {
            errors.push('Description must be text only');
          }

          // Validate unit
          if (!allowedUnits.includes(product.unit.trim().toUpperCase())) {
            errors.push(`Unit "${product.unit}" is not allowed`);
          }

          // Validate pricePerUnit
          if (
            isNaN(product.pricePerUnit) ||
            !/^\d+(\.\d{1,2})?$/.test(product.pricePerUnit)
          ) {
            errors.push('pricePerUnit must be a number with up to 2 decimals');
          }

          // Validate stock
          if (
            isNaN(product.stock) ||
            !/^\d+$/.test(product.stock)
          ) {
            errors.push('Stock must be a whole number');
          }

          // Validate name: only alphanumeric and spaces allowed
          if (
            product.name &&
            !/^[A-Za-z0-9\s]+$/.test(product.name.trim())
          ) {
            errors.push('Name must contain only alphanumeric characters and spaces');
          }

          // Check for duplicate in wholesaler's products
          const wholesalerProductQuery = query(
            collection(db, 'wholesaler', wholesalerId, 'products'),
            where('productId', '==', product.productId)
          );
          const wholesalerProductSnap = await getDocs(wholesalerProductQuery);
          if (!wholesalerProductSnap.empty) {
            errors.push(`Duplicate productId "${product.productId}" for this wholesaler`);
          }

          // Check for duplicate in top-level products collection
          const topProductQuery = query(
            collection(db, 'products'),
            where('productId', '==', product.productId),
            where('wholesalerId', '==', wholesalerId)
          );
          const topProductSnap = await getDocs(topProductQuery);
          if (!topProductSnap.empty) {
            errors.push(`Duplicate productId "${product.productId}" in global products`);
          }

          if (errors.length > 0) {
            errorCount++;
            failedRows.push({ ...product, error: errors.join('; ') });
            continue;
          }

          // Parse priceRanges
          let priceRanges = [];
          if (product.priceRanges) {
            try {
              priceRanges = JSON.parse(product.priceRanges);
              if (!Array.isArray(priceRanges)) throw new Error();
            } catch {
              priceRanges = product.priceRanges.split(',').map(pair => {
                const [minQty, price] = pair.split(':');
                return { minQty: Number(minQty), price: Number(price) };
              });
            }
          }

          const formattedProduct = {
            productId: product.productId,
            name: product.name,
            category: product.category.trim().toUpperCase(),
            description: product.description ? product.description.trim() : '',
            imageUrl: product.imageUrl || '',
            unit: product.unit.trim().toUpperCase(),
            pricePerUnit: Number(Number(product.pricePerUnit).toFixed(2)),
            stock: Number(product.stock),
            priceRanges,
            wholesalerId,
            wholesalerName,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          try {
            // Add to wholesaler's products subcollection
            await addDoc(
              collection(db, 'wholesaler', wholesalerId, 'products'),
              formattedProduct
            );
            // Add to top-level products collection
            await addDoc(
              collection(db, 'products'),
              formattedProduct
            );
            successCount++;
          } catch (err) {
            errorCount++;
            failedRows.push({ ...product, error: 'Firestore upload failed' });
          }
        }
        setFailedProducts(failedRows);
        setMessage(
          errorCount === 0
            ? `Upload complete: ${successCount} products added.`
            : `Upload complete: ${successCount} products added, ${errorCount} errors.`
        );
        setUploading(false);
      },
      error: () => {
        setMessage('Error parsing CSV file.');
        setUploading(false);
      },
    });
  };

  const totalFailedPages = Math.ceil(failedProducts.length / failedPerPage);
  const paginatedFailedProducts = failedProducts.slice(
    (failedPage - 1) * failedPerPage,
    failedPage * failedPerPage
  );

  return (
    <Box sx={{ p: 4 }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
          Product Bulk Upload
        </Typography>
        <Typography sx={{ mb: 2 }}>
          Upload a CSV file to add multiple products for a selected wholesaler in
          one go.
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Wholesaler</InputLabel>
          <Select
            value={wholesalerId}
            label="Select Wholesaler"
            onChange={(e) => setWholesalerId(e.target.value)}
          >
            {wholesalers.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Button
            variant="text"
            color="secondary"
            size="small"
            onClick={handleDownloadTemplate}
            sx={{ minWidth: 0, p: 0, textTransform: 'none' }}
          >
            Download Template CSV
          </Button>
          <label htmlFor="csv-upload">
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              component="span"
              size="small"
              sx={{ minWidth: 120, textTransform: 'none' }}
            >
              Choose File
            </Button>
          </label>
          {csvFile && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
              <Typography variant="body2">{csvFile.name}</Typography>
              <Button
                size="small"
                color="error"
                sx={{ ml: 1, minWidth: 0, p: 0, textTransform: 'none' }}
                onClick={() => setCsvFile(null)}
              >
                Remove
              </Button>
            </Box>
          )}
        </Box>
        <Button
          variant="contained"
          color="primary"
          disabled={uploading}
          onClick={handleUpload}
        >
          {uploading ? 'Uploading...' : 'Upload Products'}
        </Button>
        {message && (
          <Alert
            severity={message.includes('error') || failedProducts.length ? 'error' : 'success'}
            sx={{
              mt: 2,
              backgroundColor:
                message.includes('error') || failedProducts.length
                  ? '#f44336'
                  : '#4caf50',
              color: '#fff',
              fontWeight: 'bold',
            }}
          >
            {message}
            {failedProducts.length > 0 && (
              <Button
                variant="contained"
                size="small"
                sx={{ ml: 2, backgroundColor: '#fff', color: '#f44336', fontWeight: 'bold' }}
                onClick={handleDownloadFailed}
              >
                Download Failed Products
              </Button>
            )}
          </Alert>
        )}
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            CSV columns must match the template:{' '}
            <b>productId, name, category, description, imageUrl, unit, pricePerUnit, stock, priceRanges</b><br />
            <b>priceRanges</b> example: <code>[{"{"}minQty:1,price:5{"}"},{"{"}minQty:10,price:4.5{"}"}]</code> or <code>1:5,10:4.5</code>
          </Typography>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="error" sx={{ fontWeight: 'bold' }}>
            Note: You can upload a maximum of 200 products per file.
          </Typography>
        </Box>
        {failedProducts.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Failed Products
            </Typography>
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={handleDownloadFailed}
            >
              Download Failed Products
            </Button>
            <Box sx={{ mt: 1 }}>
              {paginatedFailedProducts.map((product, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'error.main',
                    borderRadius: 1,
                    mb: 1,
                    backgroundColor: 'rgba(255, 0, 0, 0.1)',
                  }}
                >
                  <Typography variant="body2">
                    {product.productId} - {product.name}
                  </Typography>
                  <Typography variant="caption" color="error.main">
                    {product.error}
                  </Typography>
                </Box>
              ))}
            </Box>
            {/* Pagination Controls */}
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 2 }}>
              <Button
                size="small"
                disabled={failedPage === 1}
                onClick={() => setFailedPage(failedPage - 1)}
                sx={{ mr: 1 }}
              >
                Previous
              </Button>
              <Typography variant="body2">
                Page {failedPage} of {totalFailedPages}
              </Typography>
              <Button
                size="small"
                disabled={failedPage === totalFailedPages}
                onClick={() => setFailedPage(failedPage + 1)}
                sx={{ ml: 1 }}
              >
                Next
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ProductBulkUpload;