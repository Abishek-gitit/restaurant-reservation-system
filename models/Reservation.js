const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      trim: true
    }
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch ID is required']
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table ID is required']
    },
    dateTime: {
      type: Date,
      required: [true, 'Reservation date and time are required']
    },
    duration: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [30, 'Duration must be at least 30 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
      default: 90
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    status: {
      type: String,
      enum: {
        values: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        message: '{VALUE} is not a valid reservation status'
      },
      default: 'CONFIRMED'
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes for conflict checks and efficient queries
reservationSchema.index({ customerId: 1 });
reservationSchema.index({ tableId: 1, dateTime: 1 });
reservationSchema.index({ customerId: 1, dateTime: -1 });
reservationSchema.index({ branchId: 1, dateTime: 1 });
reservationSchema.index({ status: 1 });

// Pre-validate hook to calculate endTime if dateTime and duration are provided
reservationSchema.pre('validate', function (next) {
  if (this.dateTime && this.duration) {
    this.endTime = new Date(new Date(this.dateTime).getTime() + this.duration * 60000);
  }
  next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;
