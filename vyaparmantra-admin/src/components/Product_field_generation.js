import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Chip } from '@mui/material';
import { db } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const FIELD_DOC_ID = 'product_field_settings';

const ProductFieldGeneration = () => {
  const [units, setUnits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newUnit, setNewUnit] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'system_settings', FIELD_DOC_ID);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setUnits(snap.data().units || []);
        setCategories(snap.data().categories || []);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    await setDoc(doc(db, 'system_settings', FIELD_DOC_ID), {
      units,
      categories,
    });
  };

  const addUnit = () => {
    if (newUnit && !units.includes(newUnit)) {
      setUnits([...units, newUnit]);
      setNewUnit('');
    }
  };

  const addCategory = () => {
    if (newCategory && !categories.includes(newCategory)) {
      setCategories([...categories, newCategory]);
      setNewCategory('');
    }
  };

  const removeUnit = (unit) => setUnits(units.filter(u => u !== unit));
  const removeCategory = (cat) => setCategories(categories.filter(c => c !== cat));

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Product Field Settings</Typography>
      <Typography sx={{ mb: 1 }}>Allowed Units:</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {units.map(unit => (
          <Chip key={unit} label={unit} onDelete={() => removeUnit(unit)} />
        ))}
      </Box>
      <TextField
        label="Add Unit"
        value={newUnit}
        onChange={e => setNewUnit(e.target.value)}
        size="small"
        sx={{ mr: 1 }}
      />
      <Button variant="contained" onClick={addUnit}>Add Unit</Button>

      <Typography sx={{ mt: 3, mb: 1 }}>Allowed Categories:</Typography>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {categories.map(cat => (
          <Chip key={cat} label={cat} onDelete={() => removeCategory(cat)} />
        ))}
      </Box>
      <TextField
        label="Add Category"
        value={newCategory}
        onChange={e => setNewCategory(e.target.value)}
        size="small"
        sx={{ mr: 1 }}
      />
      <Button variant="contained" onClick={addCategory}>Add Category</Button>

      <Box sx={{ mt: 3 }}>
        <Button variant="outlined" onClick={saveSettings}>Save Settings</Button>
      </Box>
    </Box>
  );
};

export default ProductFieldGeneration;