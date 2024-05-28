'use server'

import { checkRoleAdmin } from '../../../../utils/roles'
import { clerkClient } from '@clerk/nextjs/server'

export async function setRole(formData: FormData) {
	// Check that the user trying to set the role is an admin
	if (!checkRoleAdmin('admin')) {
		return { message: 'Not Authorized' }
	}

	try {
		const res = await clerkClient.users.updateUser(
			formData.get('id') as string,
			{
				publicMetadata: { role: formData.get('role') }
			}
		)
		return { message: res.publicMetadata }
	} catch (err) {
		return { message: err }
	}
}

export async function removeAdmin(formData: FormData) {
	if (!checkRoleAdmin('admin')) {
		return { message: 'Not Authorized' }
	}
	try {
		const res = await clerkClient.users.updateUser(
			formData.get('id') as string,
			{
				publicMetadata: {}
			}
		)
		return { message: res.publicMetadata }
	} catch (err) {
		return { message: err }
	}
}

export async function getUsers(query: string) {
	let users = query ? await clerkClient.users.getUserList({ query }) : []
	return users
}
