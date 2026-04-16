export const realtimeChannels = {
  order: (orderUuid) => `orders.${orderUuid}`,
  branchBoard: (branchUuid) => `branches.${branchUuid}.orders`,
  rider: (riderUuid) => `riders.${riderUuid}`,
  opsDispatch: 'ops.dispatch',
};
