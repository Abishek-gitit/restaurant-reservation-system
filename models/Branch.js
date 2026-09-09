const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Branch name must be at least 3 characters'],
      maxlength: [100, 'Branch name cannot exceed 100 characters']
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true,
      minlength: [5, 'Address must be at least 5 characters']
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Seating capacity must be at least 1']
    },
    isActive: {
      type: Boolean,
      default: true
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

const Branch = mongoose.model('Branch', branchSchema);

module.exports = Branch;
