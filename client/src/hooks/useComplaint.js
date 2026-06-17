import { useContext } from 'react';
import { ComplaintContext } from '../context/ComplaintContext';

export const useComplaint = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaint must be used within a ComplaintProvider');
  }
  return context;
};

export default useComplaint;
