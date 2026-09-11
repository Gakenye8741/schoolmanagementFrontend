{/* Terms & Conditions */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              {...register("acceptTerms", { required: "You must accept the terms." })}
              className="form-checkbox h-4 w-4 text-brandMid"
            />
            <label className="text-sm text-white">
              I agree to the{" "}
              <a href="/terms" className="underline text-blue-300 hover:text-blue-400">
                terms and conditions
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-red-400 text-sm mt-1">{errors.acceptTerms.message}</p>
          )}

           {/* Address */}
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-white" />
            <input
              {...register("address")}
              placeholder="e.g. Nairobi, Kenya"
              className="pl-10 w-full bg-transparent border border-gray-300 rounded-md px-4 py-3 text-white placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-brandMid"
            />
          </div>


import { Mail, Lock, User, Phone, MapPin} from "lucide-react";
import { useRegisterUserMutation } from "../../features/Apis/User.Apis";
import { Navbar } from "../../components/Navbar";

type RegisterFormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  contactPhone: string;
  address: string;
  acceptTerms: boolean;
};