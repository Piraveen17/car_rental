"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BookingAddons } from "@/types";
import { Car, User, Truck, Gauge } from "lucide-react";

interface AddonsSelectorProps {
  days: number;
  onChange: (addons: BookingAddons, totalAddonsPrice: number) => void;
}

// Prices (should match DB seed)
const PRICES = {
  driver: 50,    // per day
  extraKm: 20,   // per unit
  delivery: 30,  // fixed
};

export function AddonsSelector({ days, onChange }: AddonsSelectorProps) {
  const [driver, setDriver] = useState(false);
  const [extraKmQty, setExtraKmQty] = useState(0);
  const [delivery, setDelivery] = useState(false);

  // Helper to calculate and notify parent
  const updateParent = (newDriver: boolean, newExtraKm: number, newDelivery: boolean) => {
    const driverCost = newDriver ? PRICES.driver * days : 0;
    const extraKmCost = newExtraKm * PRICES.extraKm;
    const deliveryCost = newDelivery ? PRICES.delivery : 0;
    const total = driverCost + extraKmCost + deliveryCost;

    onChange(
      { driver: newDriver, extraKmQty: newExtraKm, delivery: newDelivery },
      total
    );
  };

  const handleDriverToggle = (checked: boolean) => {
    setDriver(checked);
    updateParent(checked, extraKmQty, delivery);
  };

  const handleDeliveryToggle = (checked: boolean) => {
    setDelivery(checked);
    updateParent(driver, extraKmQty, checked);
  };

  const handleExtraKmChange = (val: number) => {
    setExtraKmQty(val);
    updateParent(driver, val, delivery);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Optional Add-ons</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Chauffeur Service */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <User className="h-5 w-5 text-primary" />
             <div>
                <Label htmlFor="driver-toggle" className="font-semibold text-base">Chauffeur Service</Label>
                <p className="text-sm text-muted-foreground">Professional driver for your trip</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="font-medium">${PRICES.driver}/day</p>
                {driver && <p className="text-xs text-primary">+${PRICES.driver * days}</p>}
             </div>
             <Switch id="driver-toggle" checked={driver} onCheckedChange={handleDriverToggle} />
          </div>
        </div>

        <Separator />

        {/* Delivery & Pickup */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Truck className="h-5 w-5 text-primary" />
             <div>
                <Label htmlFor="delivery-toggle" className="font-semibold text-base">Delivery & Pickup</Label>
                <p className="text-sm text-muted-foreground">We bring the car to you</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="font-medium">${PRICES.delivery}</p>
                <p className="text-xs text-muted-foreground">Fixed fee</p>
             </div>
             <Switch id="delivery-toggle" checked={delivery} onCheckedChange={handleDeliveryToggle} />
          </div>
        </div>

        <Separator />

        {/* Extra Mileage */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Gauge className="h-5 w-5 text-primary" />
             <div>
                <Label htmlFor="extrakm-input" className="font-semibold text-base">Extra Mileage Bundle</Label>
                <p className="text-sm text-muted-foreground">Pre-purchase 100km packs</p>
             </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="font-medium">${PRICES.extraKm}/pack</p>
                {extraKmQty > 0 && <p className="text-xs text-primary">+${extraKmQty * PRICES.extraKm}</p>}
             </div>
             <div className="w-20">
                <Input 
                    id="extrakm-input" 
                    type="number" 
                    min="0" 
                    max="10"
                    value={extraKmQty} 
                    onChange={(e) => handleExtraKmChange(Number(e.target.value))} 
                />
             </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
