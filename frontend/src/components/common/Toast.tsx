import { Toaster as HotToaster } from 'react-hot-toast';

export const Toaster = () => {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#1a1a1a',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
        success: {
          iconTheme: {
            primary: '#22c55e',
            secondary: 'white',
          },
          style: {
            borderLeft: '4px solid #22c55e',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: 'white',
          },
          style: {
            borderLeft: '4px solid #ef4444',
          },
        },
        loading: {
          iconTheme: {
            primary: '#3b82f6',
            secondary: 'white',
          },
          style: {
            borderLeft: '4px solid #3b82f6',
          },
        },
      }}
    />
  );
};

// Example usage:
// import { toast } from 'react-hot-toast';
// 
// // In your component:
// toast.success('Successfully saved!');
// toast.error('Something went wrong!');
// toast.loading('Loading...');
// 
// // In your app root:
// <Toaster /> 