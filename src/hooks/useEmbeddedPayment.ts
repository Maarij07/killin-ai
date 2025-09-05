import { useState } from 'react';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

interface Plan {
  id: string;
  name: string;
  price: string;
}

export const useEmbeddedPayment = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { showError, showSuccess } = useToast();

  const openPaymentModal = async (planId: string, planName: string, planPrice: string) => {
    if (!user) {
      showError('Please sign in to purchase a plan');
      return;
    }

    // Special handling for enterprise plan
    if (planId === 'enterprise') {
      window.open('mailto:info@kallin.ai?subject=Enterprise Plan Inquiry&body=Hello, I am interested in the Enterprise plan. Please contact me to discuss the details.', '_blank');
      return;
    }

    setLoading(true);
    setSelectedPlan({ id: planId, name: planName, price: planPrice });
    setIsModalOpen(true);
    setLoading(false);
  };

  const closePaymentModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handlePaymentSuccess = () => {
    showSuccess(`Payment successful! Your ${selectedPlan?.name} plan is now active.`);
    // You can add additional logic here like refreshing user data
    closePaymentModal();
  };

  return {
    isModalOpen,
    selectedPlan,
    loading,
    openPaymentModal,
    closePaymentModal,
    handlePaymentSuccess,
  };
};
