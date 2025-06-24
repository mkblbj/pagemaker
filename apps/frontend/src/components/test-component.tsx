"use client";

import { useCounter } from "ahooks";
// import type { User, ApiResponse } from "@pagemaker/shared-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Temporary types until workspace dependency is fully resolved
interface User {
  id: string;
  username: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export function TestComponent() {
  const [count, { inc, dec, reset }] = useCounter(0);

  // Test shared-types usage
  const mockUser: User = {
    id: "test-id",
    username: "testuser",
    email: "test@example.com",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApiResponse: ApiResponse<User> = {
    success: true,
    data: mockUser,
    message: "User fetched successfully",
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Setup Verification</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            ahooks counter: {count}
          </p>
          <div className="flex gap-2 mt-2">
            <Button onClick={() => inc()} size="sm">
              +
            </Button>
            <Button onClick={() => dec()} size="sm">
              -
            </Button>
            <Button onClick={() => reset()} variant="outline" size="sm">
              Reset
            </Button>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">
            Shared-types test: {mockApiResponse.data?.username}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
