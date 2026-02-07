 import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

import connectDB from '@/lib/mongodb';
import Event, { IEventLean } from '@/database/event.model';

/**
 * Type-safe response structure for event endpoints
 */
interface EventResponse {
  message: string;
  event?: IEventLean;
  error?: string;
}

/**
 * Type for the route parameters (Next.js 15+ uses Promise for params)
 */
interface RouteParams {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * GET /api/events/[slug]
 * 
 * Fetches a single event by its slug identifier.
 * 
 * @param request - Next.js request object (unused but required by signature)
 * @param context - Route context containing dynamic parameters
 * @returns JSON response with event data or error message
 */

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse<EventResponse>> {
  try {
    // Extract and validate slug parameter
    const { slug } = await params;

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { message: 'Slug parameter is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate slug format (alphanumeric with hyphens, no special characters)
    const slugPattern = /^[a-z0-9-]+$/;
    if (!slugPattern.test(slug)) {
      return NextResponse.json(
        { 
          message: 'Invalid slug format. Slug must contain only lowercase letters, numbers, and hyphens',
          error: 'INVALID_SLUG_FORMAT' 
        },
        { status: 400 }
      );
    }

    // Ensure database connection is established
    await connectDB();

    // Query event by slug with lean() for better performance
    const event = await Event.findOne({ slug }).lean<IEventLean>().exec();

    // Handle event not found
    if (!event) {
      return NextResponse.json(
        { 
          message: `Event with slug '${slug}' not found`,
          error: 'EVENT_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    // Return successful response with event data
    return NextResponse.json(
      { 
        message: 'Event fetched successfully', 
        event 
      },
      { status: 200 }
    );

  } catch (error) {
    // Handle Mongoose-specific errors
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { 
          message: 'Invalid slug format for database query',
          error: 'DATABASE_CAST_ERROR' 
        },
        { status: 400 }
      );
    }

    // Handle database connection errors
    if (error instanceof mongoose.Error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { 
          message: 'Database connection or query failed',
          error: 'DATABASE_ERROR' 
        },
        { status: 503 }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error in GET /api/events/[slug]:', error);
    return NextResponse.json(
      { 
        message: 'An unexpected error occurred while fetching the event',
        error: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}
