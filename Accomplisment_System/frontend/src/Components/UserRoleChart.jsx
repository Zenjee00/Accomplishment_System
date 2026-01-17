import React, {
  useEffect,
  useRef,
} from 'react';

import {
  Chart,
  registerables,
} from 'chart.js';

Chart.register(...registerables); // Register chart.js components

const UserRoleChart = ({ employeeCount, moderatorCount }) => {
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');
        const chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Employees', 'Moderators'],
                datasets: [
                    {
                        label: 'User Roles',
                        data: [employeeCount, moderatorCount],
                        backgroundColor: ['rgba(54, 162, 235, 0.2)', 'rgba(75, 192, 192, 0.2)'],
                        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)'],
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
            chartInstanceRef.current.data.datasets[0].data = [employeeCount, moderatorCount];
            chartInstanceRef.current.update();
        }
    }, [employeeCount, moderatorCount]);

    return (
        <div className="user-role-chart-container">
            <canvas ref={chartRef} className="user-role-chart" width="300" height="300"></canvas>
            <div className="role-counts">
                <p>Employees: {employeeCount}</p>
                <p>Moderators: {moderatorCount}</p>
            </div>
        </div>
    );
};

export default UserRoleChart;