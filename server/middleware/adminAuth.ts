/**
 * Admin & Coordinator Middleware
 * Verifies that the authenticated user has admin or coordinator role
 */

import { Request, Response, NextFunction } from 'express';
import pool from '../db';

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: any;
}

export async function verifyAdminOrCoordinator(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check user role from database
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      const userRole = result.rows[0].role;

      if (userRole !== 'admin' && userRole !== 'coordinator') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Admin or Coordinator role required.' 
        });
      }

      // Add role to request object for use in routes
      req.user!.role = userRole;
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to verify admin access' 
    });
  }
}

export async function verifyAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication required' 
      });
    }

    // Check user role from database
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      const userRole = result.rows[0].role;

      if (userRole !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Access denied. Admin role required.' 
        });
      }

      req.user!.role = userRole;
      next();
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to verify admin access' 
    });
  }
}
