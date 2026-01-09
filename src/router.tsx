import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from "@tanstack/react-router";
import InviteAdminPage from "./app/dashboard/admins/invite/page";
import AdminsPage from "./app/dashboard/admins/page";
import BillingDetailPage from "./app/dashboard/billing/[id]/page";
import BillingPage from "./app/dashboard/billing/page";
import EditBuildingPage from "./app/dashboard/buildings/[id]/edit/page";
import FloorPlanPage from "./app/dashboard/buildings/[id]/floor-plan/page";
import NewBuildingPage from "./app/dashboard/buildings/new/page";
import BuildingsPage from "./app/dashboard/buildings/page";
import DashboardLayout from "./app/dashboard/layout";
import DashboardPage from "./app/dashboard/page";
import ReadingDetailPage from "./app/dashboard/readings/[id]/page";
import NewReadingPage from "./app/dashboard/readings/new/page";
import ReadingsPage from "./app/dashboard/readings/page";
import EditRoomPage from "./app/dashboard/rooms/[id]/edit/page";
import BulkRoomPage from "./app/dashboard/rooms/bulk/page";
import NewRoomPage from "./app/dashboard/rooms/new/page";
import RoomsPage from "./app/dashboard/rooms/page";
import SettingsPage from "./app/dashboard/settings/page";
import EditTenantPage from "./app/dashboard/tenants/[id]/edit/page";
import NewTenantPage from "./app/dashboard/tenants/new/page";
import TenantsPage from "./app/dashboard/tenants/page";
import ForgotPasswordPage from "./app/forgot-password/page";
import LoginPage from "./app/login/page";
import HomePage from "./app/page";
import CreateTeamPage from "./app/register/create-team/page";
import JoinTeamPage from "./app/register/join-team/page";
import RegisterPage from "./app/register/page";
import ResetPasswordPage from "./app/reset-password/page";
import TermsPage from "./app/terms/page";

function RootLayout() {
  return <Outlet />;
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "login",
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "register",
  component: RegisterPage,
});

const createTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "register/create-team",
  component: CreateTeamPage,
});

const joinTeamRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "register/join-team",
  component: JoinTeamPage,
});

const forgotPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "forgot-password",
  component: ForgotPasswordPage,
});

const resetPasswordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "reset-password",
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || "",
    };
  },
  component: ResetPasswordPage,
});

const termsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "terms",
  component: TermsPage,
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "overview",
  component: () => (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  ),
});

const overviewIndexRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "/",
  component: DashboardPage,
});

const billingRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "billing",
  component: BillingPage,
});

const billingDetailRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "billing/$id",
  component: BillingDetailPage,
});

const tenantsRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "tenants",
  component: TenantsPage,
});

const newTenantRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "tenants/new",
  component: NewTenantPage,
});

const editTenantRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "tenants/$id/edit",
  component: EditTenantPage,
});

const roomsRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "rooms",
  component: RoomsPage,
});

const newRoomRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "rooms/new",
  component: NewRoomPage,
});

const bulkRoomRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "rooms/bulk",
  component: BulkRoomPage,
});

const editRoomRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "rooms/$id/edit",
  component: EditRoomPage,
});

const readingsRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "readings",
  component: ReadingsPage,
});

const newReadingRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "readings/new",
  component: NewReadingPage,
});

const readingDetailRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "readings/$id",
  component: ReadingDetailPage,
});

const adminsRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "admins",
  component: AdminsPage,
});

const inviteAdminRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "admins/invite",
  component: InviteAdminPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "settings",
  component: SettingsPage,
});

const buildingsRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "buildings",
  component: BuildingsPage,
});

const newBuildingRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "buildings/new",
  component: NewBuildingPage,
});

const editBuildingRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "buildings/$id/edit",
  component: EditBuildingPage,
});

const floorPlanRoute = createRoute({
  getParentRoute: () => overviewRoute,
  path: "buildings/$id/floor-plan",
  component: FloorPlanPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  createTeamRoute,
  joinTeamRoute,
  forgotPasswordRoute,
  resetPasswordRoute,
  termsRoute,
  overviewRoute.addChildren([
    overviewIndexRoute,
    billingRoute,
    billingDetailRoute,
    tenantsRoute,
    newTenantRoute,
    editTenantRoute,
    roomsRoute,
    newRoomRoute,
    bulkRoomRoute,
    editRoomRoute,
    readingsRoute,
    newReadingRoute,
    readingDetailRoute,
    adminsRoute,
    inviteAdminRoute,
    settingsRoute,
    buildingsRoute,
    newBuildingRoute,
    editBuildingRoute,
    floorPlanRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
