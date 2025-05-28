import { useEffect, useState } from "react";
import { useSupabase } from "../../contexts/SupabaseContext";
import { SubscriptionSuccess } from "./SubscriptionSuccess";

interface StripeCheckoutModalProps {
  priceId: string | undefined;
  trialDays: number | undefined;
  promoCode:boolean;
  onClose: () => void;
}
export default function StripeCheckoutModal({
  priceId,
  promoCode,
  trialDays = 0,
  onClose,
}: StripeCheckoutModalProps) {
  const { session: token } = useSupabase();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleSubscribe = async () => {
    try {
      const response = await fetch(
        `/api/stripe/create-checkout-session?priceId=${priceId}&trialDays=${trialDays}&promoCode=${promoCode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token?.access_token}`,
          },
        }
      );
      if (!response.ok) {
        const errorResponse = await response.json();
        throw new Error(errorResponse.error || "Failed to create subscription");
      }

      const data = await response.json();
      if (data.sessionUrl) {
        setLoading(false);
        window.location.href = data.sessionUrl;
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Error creating subscription:", err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (priceId && token) {
      handleSubscribe();
    }
  }, [priceId, token]);

  useEffect(() => {
    // Check URL for success parameter
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('subscription') === 'success') {
      setShowSuccess(true);
      setLoading(false);
    }
  }, []);

  if (showSuccess) {
    return <SubscriptionSuccess onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-2xl text-center">
        <h2 className="text-white text-2xl font-bold mb-4">Processing...</h2>
        <p className="text-gray-400 mb-6">
          We're redirecting you to the payment page.
        </p>
        {loading && (
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-orange-500 border-opacity-75 mx-auto mb-4"></div>
        )}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}