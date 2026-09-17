import { LoadingSpinner } from '@/components'
import { useAuth } from '@/contexts'
import React from 'react'

const AuthMiddleware = ({children}) => {
    const {loading} = useAuth()

//     const {isLoading,data} = useQuery({queryKey:['authUser'], queryFn:() => authApi.getCurrentUser(),
// //   enabled: !!cookies.logged_in,
//   select: data => data.data,
//   onSuccess: data => {
//     stateContext.dispatch({ type: 'SET_USER', payload: data })
//   }
// })

// useEffect(() => {
//     if (data) {
//         console.log('User loaded successfully')
//         console.log(data)
//         stateContext.dispatch({ type: 'SET_USER', payload: data })
//         console.log(stateContext)

//     } else {
//         console.log('User not loaded')
//     }
// }, [data])

if (loading){
    return <LoadingSpinner/>
}
// console.log(data)

  return  children

}

export default AuthMiddleware
