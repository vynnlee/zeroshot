"use client";

import React, { useState, useEffect } from "react";
import Timer from "../components/Timer";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const HomePage: React.FC = () => {
  const [serverUrl, setServerUrl] = useState<string>("");
  const [fetching, setFetching] = useState<boolean>(false);
  const [stop, setStop] = useState<boolean>(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setServerUrl(event.target.value);
  };

  const handleFetchClick = () => {
    setFetching(true);
    setStop(false);
  };

  const handleStopClick = () => {
    setStop(true);
    setFetching(false);
  };

  return (
    <main className="flex flex-col items-center justify-center h-screen space-y-6">
      <h1 className="text-3xl font-bold">Server Time Fetcher</h1>
      <Input
        type="text"
        placeholder="Enter server URL"
        value={serverUrl}
        onChange={handleInputChange}
        className="w-64"
      />
      <div className="space-x-4">
        <Button onClick={handleFetchClick} disabled={fetching}>
          Fetch Time
        </Button>
        <Button onClick={handleStopClick} disabled={!fetching}>
          Stop
        </Button>
      </div>
      {fetching && !stop && serverUrl && (
        <Timer serverTimeUrl={serverUrl} stop={stop} />
      )}
    </main>
  );
};

export default HomePage;
