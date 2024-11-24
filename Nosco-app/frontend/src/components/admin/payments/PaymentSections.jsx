import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentProcessingSection from './PaymentProcessingSection';
import CreatePaymentSection from './CreatePaymentSection';

const PaymentSections = () => {
  return (
    <Tabs defaultValue="processing" className="w-full">
      <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
        <TabsTrigger value="processing">Payment Processing</TabsTrigger>
        <TabsTrigger value="create">Create Payment</TabsTrigger>
      </TabsList>
      
      <TabsContent value="processing">
        <PaymentProcessingSection />
      </TabsContent>
      
      <TabsContent value="create">
        <CreatePaymentSection />
      </TabsContent>
    </Tabs>
  );
};

export default PaymentSections;