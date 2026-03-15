import React from 'react';
import { Box, Skeleton } from '@mui/material';

interface DataGridSkeletonProps {
  rows?: number;
  columns?: number;
  height?: number;
}

export default function DataGridSkeleton({ 
  rows = 10, 
  columns = 8,
  height = 600 
}: DataGridSkeletonProps) {
  return (
    <Box sx={{ height, width: '100%' }}>
      {/* Header Skeleton */}
      <Box sx={{ display: 'flex', gap: 0.5, mb: 1, px: 2 }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={`header-${i}`}
            variant="rectangular"
            height={32}
            width="100%"
            sx={{ flex: 1 }}
          />
        ))}
      </Box>
      
      {/* Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box 
          key={`row-${rowIndex}`} 
          sx={{ display: 'flex', gap: 0.5, mb: 1, px: 2 }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              variant="rectangular"
              height={48}
              width="100%"
              sx={{ flex: 1 }}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}