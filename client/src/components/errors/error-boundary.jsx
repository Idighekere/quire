import ErrorPage from '@/pages/unprotected/error'
import { Component } from 'react'

/**
 * ErrorBoundary component that catches errors in its child components
 * and displays a fallback UI
 */

class ErrorBoundary extends Component {
  constructor (props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError (error) {
    // update the state so the next render will show the UI
    return {hasError:true,error}
  }



  componentDidCatch(error,errorInfo){
    console.error("Error caught by ErrorBoundary:",error,errorInfo)

    this.setState({errorInfo})
  }

  resetError(){
    this.setState({hasError:false,error:null,errorInfo:null})
  }

  render(){
    const {hasError,error,errorInfo}=this.state
    const {fallback:FallbackUI,children}=this.props

    if(hasError){
        return <ErrorPage  error={error} errorInfo={errorInfo} onReset={()=>this.resetError()} />
    }

    return children
  }
}

export default ErrorBoundary
