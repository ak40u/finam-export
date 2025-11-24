import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import { debounce } from 'lodash';
import { TickerInfo } from '../types';

interface TickerSearchProps {
  onSelect: (ticker: TickerInfo) => void;
}

const TickerSearch: React.FC<TickerSearchProps> = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<TickerInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const searchTickers = async (query: string) => {
    if (!query || query.length < 2) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await window.api.search(query);
      setOptions(results);
    } catch (error) {
      console.error('Search error:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(searchTickers, 500);

  useEffect(() => {
    debouncedSearch(inputValue);
    return () => {
      debouncedSearch.cancel();
    };
  }, [inputValue]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(event, value) => {
        if (value) {
          onSelect(value);
        }
      }}
      getOptionLabel={(option) => `${option.code} - ${option.name}`}
      renderOption={(props, option) => (
        <li {...props}>
          <Box>
            <Typography variant="body1" component="div">
              {option.code}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {option.name} (ID: {option.id})
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Поиск тикера"
          placeholder="Введите код или название"
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
};

export default TickerSearch;
