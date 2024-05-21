import React from 'react';
import { Button } from 'react-bootstrap';

const Logout = () => {
    const handleLogout = async () => {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            if (response.ok) {
                // Logout successful, redirect or show success message
            } else {
                // Handle logout error
            }
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <Button onClick={handleLogout} style={{ backgroundColor: 'purple' }}>Logout</Button>
    );
};

export default Logout;
