import React, {
  useEffect,
  useRef,
} from 'react';

import {
  Chart,
  registerables,
} from 'chart.js';

Chart.register(...registerables);

const ModsAccountChart = ({ pendingCount, approvedCount, declinedCount }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');
        const chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Pending', 'Approved', 'Declined'],
                datasets: [
                    {
                        label: 'Report Status',
                        data: [pendingCount, approvedCount, declinedCount],
                        backgroundColor: ['rgba(255, 206, 86, 0.2)', 'rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)'],
                        borderColor: ['rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 50,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        });

        chartInstanceRef.current = chartInstance;

        return () => {
            chartInstance.destroy();
        };
    }, []);

    useEffect(() => {
        if (chartInstanceRef.current) {
            chartInstanceRef.current.data.datasets[0].data = [pendingCount, approvedCount, declinedCount];
            chartInstanceRef.current.update();
        }
    }, [pendingCount, approvedCount, declinedCount]);

    return (
        <div className="mods-account-chart-container">
            <canvas ref={chartRef} className="mods-account-chart" width="300" height="300"></canvas>
        </div>
    );
};

export default ModsAccountChart;