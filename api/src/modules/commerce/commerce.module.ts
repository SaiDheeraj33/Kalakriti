import { Module } from "@nestjs/common";
import { CartController } from "./cart/cart.controller";
import { CartService } from "./cart/cart.service";
import { CheckoutController } from "./checkout/checkout.controller";
import { CheckoutService } from "./checkout/checkout.service";
import { OptionalAuthGuard } from "./checkout/optional-auth.guard";
import { InventoryController } from "./inventory/inventory.controller";
import { InventoryService } from "./inventory/inventory.service";
import { OrdersController } from "./orders/orders.controller";
import { OrdersService } from "./orders/orders.service";
import { MockGateway } from "./payments/mock.gateway";
import { PaymentsController } from "./payments/payments.controller";
import { PaymentsService } from "./payments/payments.service";
import { RazorpayGateway } from "./payments/razorpay.gateway";
import { FlatRateShippingProvider } from "./shipping/flat-rate.provider";
import { ShiprocketProvider } from "./shipping/shiprocket.provider";

@Module({
  controllers: [
    CartController,
    CheckoutController,
    InventoryController,
    OrdersController,
    PaymentsController,
  ],
  providers: [
    CartService,
    CheckoutService,
    InventoryService,
    OrdersService,
    PaymentsService,
    OptionalAuthGuard,
    RazorpayGateway,
    MockGateway,
    FlatRateShippingProvider,
    ShiprocketProvider,
  ],
  exports: [CartService, InventoryService],
})
export class CommerceModule {}
