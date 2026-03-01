import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const VerifyClient = () => {
    const { clientId } = useParams();

    useEffect(() => {
        const verifyCertificate = async () => {
            try {
                const response = await fetch(`/api/verify/${clientId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Certificate verification failed');
                }
                // Handle successful verification
            } catch (error) {
                const { message } = error;
                console.error('Verification error:', message);
                // Handle error appropriately
            }
        };

        if (clientId) {
            verifyCertificate();
        }
    }, [clientId]);

    return (
        <div>
            <h1>Verify Client</h1>
            {/* Additional component structure */}
        </div>
    );
};

export default VerifyClient;