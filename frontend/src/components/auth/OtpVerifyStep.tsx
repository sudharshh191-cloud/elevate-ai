import React, { useState, useRef, useEffect } from 'react';
import { KeyRound, ArrowRight, RotateCw, Loader2 } from 'lucide-react';

interface OtpVerifyStepProps {
  email: string;
  type: 'login' | 'reset_password' | 'verification';
  onVerify: (otp: string) => void;
  onResendOtp: () => void;
  onBack: () => void;
  isLoading: boolean;
  isResending?: boolean;
  error?: string | null;
}

export const OtpVerifyStep: React.FC<OtpVerifyStepProps> = ({
  email,
  onVerify,
  onResendOtp,
  onBack,
  isLoading,
  isResending = false,
  error,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // 60s Resend countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle single digit input
  const handleChange = (index: number, val: string) => {
    const char = val.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6 && !newDigits.includes('')) {
      onVerify(fullCode);
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle paste full 6-digit code
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const splitDigits = pastedData.split('');
      setDigits(splitDigits);
      inputRefs.current[5]?.focus();
      onVerify(pastedData);
    }
  };

  const handleResend = () => {
    if (timeLeft > 0) return;
    setTimeLeft(60);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
    onResendOtp();
  };

  const fullCode = digits.join('');
  const isComplete = fullCode.length === 6 && !digits.includes('');

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
            <KeyRound className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Enter Verification Code</h2>
        </div>
        <p className="text-xs text-slate-500">
          We sent a 6-digit passcode to <span className="text-slate-900 font-mono font-medium">{email}</span>.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      {/* 6-Digit PIN Input Boxes */}
      <div className="flex items-center justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className="w-12 h-14 text-center text-xl font-bold font-mono bg-white border border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl text-slate-900 outline-none transition-all shadow-2xs"
          />
        ))}
      </div>

      {/* Verify CTA Button */}
      <button
        type="button"
        disabled={isLoading || !isComplete}
        onClick={() => onVerify(fullCode)}
        className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying Passcode...</span>
          </>
        ) : (
          <>
            <span>Verify & Continue</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Resend Timer & Back Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <button
          type="button"
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
        >
          ← Back
        </button>

        {timeLeft > 0 ? (
          <span className="text-slate-400 font-mono text-[11px]">
            Resend OTP in <strong>{timeLeft}s</strong>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <RotateCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
            <span>Resend Code</span>
          </button>
        )}
      </div>
    </div>
  );
};
