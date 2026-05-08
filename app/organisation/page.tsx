"use client";

import { Container, Paper, Box, Typography } from "@mui/material";
import { useAuth } from "@/context/AuthContext";
import { OrganisationDashboard } from "@/components/OrganisationDashboard";
import { NoOrganisation } from "@/components/NoOrganisationDashboard";

export default function OrganisationPage() {
  const { user, isAuthReady ,token} = useAuth();


  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <p>Not logged in</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Container maxWidth="xl">
        <Paper elevation={3} className="p-8 rounded-lg">
          <Box className="mb-8">
            <Typography variant="h4" component="h1" className="font-bold text-gray-900 mb-2">
              Organisation
            </Typography>
            <Typography variant="body1" className="text-gray-600">
              Manage your organisation, shared inboxes, contacts, and teams.
            </Typography>
          </Box>

          {user.organisationId ? (
             <OrganisationDashboard organisationId={user.organisationId} token={token}/>
          ) : (
            <NoOrganisation />
          )}
        </Paper>
      </Container>
    </div>
  );
}
