import axios from 'axios';

const getBaseURL = () => {
    return 'http://localhost:5001';
}


const api = axios.create({
    baseURL: getBaseURL(),
    timeout: 15000,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.error || error.response.statusText;
            throw new Error(`API Error ${status}: ${message}`);
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Request timeout');
        }
        throw new Error(`Network error: ${error.message}`);
    }
);

export class ASCOM_Telescope {

    async connect(): Promise<void> {
        await api.get('/api/v1/mount/connect');
    }

    async disconnect(): Promise<void> {
        await api.get('/api/v1/mount/disconnect');
    }

    async isConnected(): Promise<string> {
        const response = await api.get('/api/v1/mount/state');
        return response.data.status;
    }

    async getPosition(): Promise<{ az: number; alt: number }> {
        const response = await api.get('/api/v1/mount/position');
        return response.data;
    }

    async slew(ra: number, dec: number): Promise<void> {
        await api.post('/api/v1/mount/slew', { ra, dec });
    }
}