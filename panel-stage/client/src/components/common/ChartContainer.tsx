import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
    children: React.ReactElement;
    height?: number | string;
    width?: number | string;
    minHeight?: number;
    debounce?: number;
}

/**
 * A standard wrapper for Recharts that prevents "width(-1)" errors 
 * by ensuring the parent container has actual dimensions before rendering.
 */
export default function ChartContainer({
    children,
    height = '100%',
    width = '100%',
    minHeight = 0,
    debounce = 50
}: ChartContainerProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [hasDimensions, setHasDimensions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted || !containerRef.current) return;

        const el = containerRef.current;
        const checkDimensions = () => {
            const { width, height } = el.getBoundingClientRect();
            if (width > 0 && height > 0) {
                setHasDimensions(true);
            }
        };

        // Initial check
        checkDimensions();

        // Observe resizes
        const resizeObserver = new ResizeObserver(checkDimensions);
        resizeObserver.observe(el);

        return () => resizeObserver.disconnect();
    }, [isMounted]);

    if (!isMounted) {
        return <Box sx={{ height, width }} />;
    }

    return (
        <Box
            ref={containerRef}
            sx={{
                height,
                width,
                position: 'relative',
                minHeight,
                minWidth: 0,
                overflow: 'hidden'
            }}
        >
            {hasDimensions && (
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    debounce={debounce}
                >
                    {children}
                </ResponsiveContainer>
            )}
        </Box>
    );
}
