import { Box, Button, Grid, MenuItem, Stack, TextField, Typography } from '@mui/material';
import type { NotificationFilter } from '../services/api';

interface FilterBarProps {
  filter: NotificationFilter;
  page: number;
  limit: number;
  hasNextPage: boolean;
  loading: boolean;
  onFilterChange: (filter: NotificationFilter) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  onRefresh: () => void;
}

export function FilterBar({
  filter,
  page,
  limit,
  hasNextPage,
  loading,
  onFilterChange,
  onPageChange,
  onLimitChange,
  onRefresh,
}: FilterBarProps) {
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, p: 2.25, backgroundColor: 'rgba(255,255,255,0.6)' }}>
      <Grid container spacing={2} alignItems="end">
        <Grid item xs={12} md={4}>
          <TextField select label="Notification type" value={filter} onChange={(event) => onFilterChange(event.target.value as NotificationFilter)} fullWidth>
            <MenuItem value="All">All</MenuItem>
            <MenuItem value="Event">Event</MenuItem>
            <MenuItem value="Result">Result</MenuItem>
            <MenuItem value="Placement">Placement</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Limit"
            type="number"
            value={limit}
            onChange={(event) => onLimitChange(Math.max(1, Math.min(100, Number(event.target.value) || 1)))}
            inputProps={{ min: 1, max: 100 }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <TextField
            label="Page"
            type="number"
            value={page}
            onChange={(event) => onPageChange(Math.max(1, Number(event.target.value) || 1))}
            inputProps={{ min: 1 }}
            fullWidth
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack direction="row" spacing={1} justifyContent="flex-end" flexWrap="wrap">
            <Button variant="outlined" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={loading || page <= 1}>
              Previous
            </Button>
            <Button variant="outlined" onClick={() => onPageChange(page + 1)} disabled={loading || !hasNextPage}>
              Next
            </Button>
            <Button variant="contained" onClick={onRefresh} disabled={loading}>
              Refresh
            </Button>
          </Stack>
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Page {page} with {limit} notification(s) per request.
      </Typography>
    </Box>
  );
}