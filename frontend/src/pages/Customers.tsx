<td>
  <span className={`px-2 py-1 rounded-full text-xs ${
    customer.risk_category === 'excellent' ? 'bg-green-100 text-green-800' :
    customer.risk_category === 'good' ? 'bg-blue-100 text-blue-800' :
    customer.risk_category === 'watch' ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800'
  }`}>
    {customer.risk_score} - {customer.risk_category}
  </span>
</td>
