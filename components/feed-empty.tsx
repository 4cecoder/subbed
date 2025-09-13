"use client";

import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function FeedEmpty() {
  const addSubscription = useMutation(api.subscriptions.addSubscription);

  const handleAddSample = () => {
    addSubscription({
      channelId: "UC-lHJZR3Gqxm24_Vd_AJ5Yw",
      channelName: "Google",
      channelLogoUrl:
        "https://yt3.ggpht.com/ytc/AAUvwni_LdnpDi-SOIhjp4Kxo2l_yVBoYsfdDCpUM5IK=s88-c-k-c0x00ffffff-no-rj",
      channelUrl: "https://www.youtube.com/channel/UC-lHJZR3Gqxm24_Vd_AJ5Yw",
    });
  };

  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold mb-4">No subscriptions yet</h2>
      <p className="mb-8">
        Add your favorite YouTube channels to see their latest videos here.
      </p>
      <Button onClick={handleAddSample}>Add Sample Subscription</Button>
    </div>
  );
}
