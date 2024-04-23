import React, { useState, useEffect } from 'react';
import CoachesandActivitiesAdminPage from "../../components/admin/editcoachesandactivities"
import NavbarComponent from '@/app/components/users/navbar';
import AdminNavbarComponent from '@/app/components/admin/adminnavbar';
import { checkRoleAdmin } from '../../../../utils/roles';
import { redirect } from 'next/navigation';

export default function addactivityandcoaches() {
  if (!checkRoleAdmin("admin")) {
    redirect("/");
  }
  return(
    <div>
      <AdminNavbarComponent/>
      <CoachesandActivitiesAdminPage/>

    </div>

  )

}