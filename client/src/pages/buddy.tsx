import React from 'react';
import BuddyChat from '../components/BuddyChat';
import MainLayout from '../components/layout/MainLayout';

const BuddyPage: React.FC = () => {
  return (
    <MainLayout showFooter={false}>
      <div className="h-screen">
        <BuddyChat />
      </div>
    </MainLayout>
  );
};

export default BuddyPage;
