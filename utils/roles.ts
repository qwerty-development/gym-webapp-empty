import { auth } from '@clerk/nextjs'

export const checkRoleAdmin = (role: 'admin') => {
	const { sessionClaims } = auth()
	console.log(sessionClaims)
	console.log(sessionClaims?.metadata)
	console.log(sessionClaims?.metadata?.role)
	return sessionClaims?.metadata?.role === role
}
