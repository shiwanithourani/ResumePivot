import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const UpgradePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Upgrade to Pro</CardTitle>
            <CardDescription>
              Unlock unlimited application generations and more.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>This is a placeholder for the upgrade page. In a real application, this would contain pricing information and a way to subscribe.</p>
            <Button className="w-full">Upgrade Now (Placeholder)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpgradePage;