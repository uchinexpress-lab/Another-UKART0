
import React from 'react';
import { Navigate } from 'react-router-dom';

export default function Order() {
  return <Navigate to="/orders" replace />;
}