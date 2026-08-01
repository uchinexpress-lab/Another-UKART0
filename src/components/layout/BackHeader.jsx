import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function BackHeader() {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button
      onClick={goBack}
      aria-label="Back"
      className="fixed top-3 left-3 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-md shadow-md flex items-center justify-center hover:bg-white active:scale-90 transition-transform"
    >
      <ArrowLeft className="w-5 h-5 text-gray-700" />
    </button>
  );
}