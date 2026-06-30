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

    async slew(az: number, alt: number): Promise<void> {
        await api.post('/api/v1/mount/slew', { "az": az, "alt": alt });
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
        return response.data;
    }

    async disconnect(): Promise<void> {
        await api.get('/api/v1/camera/disconnect');
    }

    async isConnected(): Promise<string> {
        const response = await api.get('/api/v1/camera/state');
        return response.data.status;
    }

    async takeExposure(exposure_time: number, gain: number): Promise<string | null> {
        const response = await api.post('/api/v1/camera/start_capture', { "exposure_time": exposure_time, "gain": gain });
        if (response.data.status === 'image_ready') {
            return response.data.image;
        }
        return null;
    }
}

export class ASCOM_plate_solver {

    url_solver: string = "/api/v1/platesolver"

    async plateSolve(exposure_time: number, gain: number): Promise<{ submission_id: number, image: string } | null> {
        const response = await api.post(`${this.url_solver}/solve`, { exposure_time, gain }, { timeout: 120000 });
        if (response.data.status === 'submitted') {
            return { submission_id: response.data.submission_id, image: response.data.image };
        }
        return null;
    }

    async plateStatus(submission_id: number): Promise<{ job_status: string; job_id: number | null; submission_id: number }> {
        const response = await api.post(`${this.url_solver}/solve_status`, { submission_id });
        return response.data;
    }

    async getPlateSolveResult(job_id: number): Promise<PlateSolveResult | null> {
        const response = await api.post(`${this.url_solver}/solve_result`, { job_id });
        if (response.data.status === 'solved') {
            return response.data;
        }
        return null;
    }
}


