import { supabase } from '../../lib/supabase';
import { decode } from 'base64-arraybuffer';

export const uploadTimelineImage = async (imageUri: string, plantId: string) => {
  try {
    // Convert image to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result.split(',')[1];
          const fileName = `${plantId}/${Date.now()}.jpg`;
          
          // Upload to timeline bucket
          const { data, error } = await supabase.storage
            .from('plant-timeline-images')
            .upload(fileName, decode(base64), {
              contentType: 'image/jpeg',
              upsert: true
            });

          if (error) throw error;

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('plant-timeline-images')
            .getPublicUrl(fileName);

          resolve(publicUrl);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error uploading timeline image:', error);
    throw error;
  }
};
