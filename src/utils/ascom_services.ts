import { Annotation, Calibration } from '@/model/platesolve_types';
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

export async function checkServerHealth(): Promise<boolean> {
    try {
        await api.get('/api/health', { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

export class ASCOM_Telescope {

    async connect(): Promise<string> {
        const response = await api.get('/api/v1/mount/connect');
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        return response.data.name;
    }

    async disconnect(): Promise<void> {
        const response = await api.get('/api/v1/mount/disconnect');
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
    }

    async isConnected(): Promise<string> {
        const response = await api.get('/api/v1/mount/state');
        return response.data.status;
    }

    async getPosition(): Promise<{ az: number; alt: number }> {
        const response = await api.get('/api/v1/mount/position');
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        return { az: response.data.az, alt: response.data.alt };
    }

    async slew(az: number, alt: number): Promise<void> {
        const response = await api.post('/api/v1/mount/slew', { az, alt });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
    }

    async syncToAltAz(az: number, alt: number): Promise<void> {
        const response = await api.post('/api/v1/mount/syncToAltAz', { az, alt });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
    }

    async syncToRaDec(ra: number, dec: number): Promise<void> {
        const response = await api.post('/api/v1/mount/syncToRaDec', { ra, dec });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
    }
}

export type CameraConnectResult = {
    status: string;
    name?: string;
    xsize?: number;
    ysize?: number;
};
export type PlateSolveResult = {
    status: 'solved';
    job_id: number;
    calibration: Calibration;
    annotations: Annotation[];
};

export class ASCOM_Camera {

    async connect(): Promise<CameraConnectResult> {
        const response = await api.get('/api/v1/camera/connect');
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        return response.data;
    }

    async disconnect(): Promise<void> {
        const response = await api.get('/api/v1/camera/disconnect');
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
    }

    async isConnected(): Promise<CameraConnectResult> {
        const response = await api.get('/api/v1/camera/state');
        return response.data;
    }

    async takeExposure(exposure_time: number, gain: number): Promise<string> {
        const response = await api.post('/api/v1/camera/start_capture', { exposure_time, gain });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        if (response.data.status !== 'image_ready') {
            throw new Error('Image non disponible');
        }
        return response.data.image;
    }
}

export class ASCOM_plate_solver {

    url_solver: string = "/api/v1/platesolver"

    async plateSolve(exposure_time: number, gain: number): Promise<{ submission_id: number, image: string }> {
        const response = await api.post(`${this.url_solver}/solve`, { exposure_time, gain }, { timeout: 120000 });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        if (response.data.status !== 'submitted') {
            throw new Error('Échec de soumission du plate solve');
        }
        return { submission_id: response.data.submission_id, image: response.data.image };
    }

    async plateStatus(submission_id: number): Promise<{ job_status: string; job_id: number | null; submission_id: number }> {
        const response = await api.post(`${this.url_solver}/solve_status`, { submission_id });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        return response.data;
    }

    async getPlateSolveResult(job_id: number): Promise<PlateSolveResult> {
        const response = await api.post(`${this.url_solver}/solve_result`, { job_id });
        if (response.data.status === 'error') {
            throw new Error(response.data.message);
        }
        if (response.data.status !== 'solved') {
            throw new Error('Plate solve non résolu');
        }
        return response.data;
    }

}


