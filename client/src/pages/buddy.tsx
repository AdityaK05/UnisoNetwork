import React from 'react';
import BuddyChatV2 from '../components/BuddyChat_v2';
import MainLayout from '../components/layout/MainLayout';

const BuddyPage: React.FC = () => {
  return (
    <MainLayout showFooter={false}>
      <div className="h-screen flex flex-col">
        <BuddyChatV2 />
      </div>
    </MainLayout>
  );
};

export default BuddyPage;
