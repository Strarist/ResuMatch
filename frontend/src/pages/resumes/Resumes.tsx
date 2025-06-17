import React from 'react';
import { PageTransition } from '../../components/common/PageTransition';
import { Card, CardHeader, CardBody } from '../../components/common/Card';

const Resumes: React.FC = () => {
  return (
    <PageTransition>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Resumes
        </h1>
        
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">My Resumes</h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600 dark:text-gray-400">
              Resume management page - coming soon!
            </p>
          </CardBody>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Resumes; 