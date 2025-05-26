import cloudinary from '../configs/cloudinary.config';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

interface CloudinaryUploadResult {
  success: boolean;
  data?: {
    url: string;
    publicId: string;
    secureUrl: string;
  };
  error?: string;
}

// Upload image buffer to Cloudinary
export const uploadImageToCloudinary = async (
  buffer: Buffer,
  folder: string = 'cityscope/posts'
): Promise<CloudinaryUploadResult> => {
  try {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit' }, // Limit max size
            { quality: 'auto' }, // Auto quality optimization
            { fetch_format: 'auto' } // Auto format optimization
          ]
        },
        (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            resolve({
              success: false,
              error: error.message || 'Upload failed'
            });
          } else if (result) {
            resolve({
              success: true,
              data: {
                url: result.url,
                publicId: result.public_id,
                secureUrl: result.secure_url
              }
            });
          } else {
            resolve({
              success: false,
              error: 'Unknown upload error'
            });
          }
        }
      ).end(buffer);
    });
  } catch (error) {
    console.error('Cloudinary service error:', error);
    return {
      success: false,
      error: 'Service error occurred'
    };
  }
};