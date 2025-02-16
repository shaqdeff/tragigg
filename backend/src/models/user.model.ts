import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  isVerified: boolean;
  verificationCode: string;
  verificationCodeExpires: Date | null;
  googleId?: string;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
    },
    phone: { type: String, required: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
