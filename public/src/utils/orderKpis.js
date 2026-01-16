export const getActiveOrders = (orders) => {
  return orders.filter(order => {
    if (!order.status) return true
    return order.status !== 'Tamamlandı' && order.status !== 'İptal'
  })
}

export const calculateKpis = (orders) => {
  const activeOrders = getActiveOrders(orders)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  weekFromNow.setHours(0, 0, 0, 0)
  
  const openOrders = activeOrders.length
  const criticalOrders = activeOrders.filter(o => o.riskLevel === 'high').length
  const avgProgress = activeOrders.length > 0 
    ? activeOrders.reduce((sum, o) => sum + (o.progress || 0), 0) / activeOrders.length 
    : 0
  const thisWeekDeliveries = activeOrders.filter(o => {
    if (!o.deliveryDate) return false
    const deliveryDate = new Date(o.deliveryDate)
    deliveryDate.setHours(0, 0, 0, 0)
    return deliveryDate >= today && deliveryDate <= weekFromNow
  }).length
  
  return {
    openOrders,
    criticalOrders,
    avgProgress: Math.round(avgProgress * 10) / 10,
    thisWeekDeliveries,
    highRisk: criticalOrders,
    mediumRisk: activeOrders.filter(o => o.riskLevel === 'medium').length,
    willNotDeliver: activeOrders.filter(o => {
      const daysRemaining = o.daysRemaining || 0
      const progress = o.progress || 0
      return daysRemaining < 0 || (daysRemaining < 7 && progress < 50)
    }).length
  }
}

export const calculateFilteredKpis = (filteredOrders) => {
  if (!filteredOrders || filteredOrders.length === 0) {
    return {
      highRisk: 0,
      mediumRisk: 0,
      thisWeekDeliveries: 0,
      willNotDeliver: 0
    }
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const weekFromNow = new Date(today)
  weekFromNow.setDate(weekFromNow.getDate() + 7)
  weekFromNow.setHours(0, 0, 0, 0)
  
  const highRisk = filteredOrders.filter(o => o.riskLevel === 'high').length
  const mediumRisk = filteredOrders.filter(o => o.riskLevel === 'medium').length
  const thisWeekDeliveries = filteredOrders.filter(o => {
    if (!o.deliveryDate) return false
    const deliveryDate = new Date(o.deliveryDate)
    deliveryDate.setHours(0, 0, 0, 0)
    return deliveryDate >= today && deliveryDate <= weekFromNow
  }).length
  const willNotDeliver = filteredOrders.filter(o => {
    const daysRemaining = o.daysRemaining || 0
    const progress = o.progress || 0
    return daysRemaining < 0 || (daysRemaining < 7 && progress < 50)
  }).length
  
  return {
    highRisk,
    mediumRisk,
    thisWeekDeliveries,
    willNotDeliver
  }
}

