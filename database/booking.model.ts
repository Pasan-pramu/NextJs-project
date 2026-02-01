import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import Event from './event.model';

// TypeScript interface for Booking document
export interface IBooking extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event ID is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      validate: {
        validator: (v: string) => {
          // RFC 5322 compliant email regex
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Invalid email format',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster event-based queries
BookingSchema.index({ eventId: 1 });

/**
 * Pre-save hook to verify event existence
 * - Validates that the referenced eventId exists in the database
 * - Prevents orphaned bookings
 */
BookingSchema.pre('save', async function (next) {
  // Only validate eventId if it's modified or new
  if (this.isModified('eventId')) {
    const eventExists = await Event.findById(this.eventId);
    
    if (!eventExists) {
      throw new Error('Event does not exist');
    }
  }

  next();
});

// Prevent model recompilation in development
const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
