package com.evgenii.my_market.service;

import com.evgenii.my_market.dao.OrderDAO;
import com.evgenii.my_market.dto.OrderConfirmDto;
import com.evgenii.my_market.dto.OrderDto;
import com.evgenii.my_market.dto.ProductStatisticDto;
import com.evgenii.my_market.dto.StatisticDto;
import com.evgenii.my_market.entity.*;
import com.evgenii.my_market.exception_handling.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;


import javax.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final OrderDAO orderDAO;
    private final CartService cartService;
    private final UserService userService;

    @Transactional
    public Order createFromUserCart(OrderConfirmDto orderConfirmDto) {
        boolean paymentState = true;
        User user = userService.findByUsername(orderConfirmDto.getUsername()).orElseThrow(() -> new ResourceNotFoundException("User not found"));//TODO disable DB and check method throws exc
        Cart cart = cartService.findById(UUID.fromString(orderConfirmDto.getCartId())).orElseThrow(() -> new ResourceNotFoundException("Cart not found"));
        if (orderConfirmDto.getPaymentMethod().equals("cash")) paymentState = false;
        Order order = new Order(cart, user, user.getUserAddress(), orderConfirmDto.getAddress(), orderConfirmDto.getPaymentMethod(), paymentState);
        order.setOrderState(StateEnum.AWAITING_SHIPMENT);
        order = orderDAO.saveOrder(order);
        cart.getCartItems().forEach(cartItem -> cartItem.getProduct().decrementQuantityProduct(cartItem.getQuantity()));
        cartService.clearCart(UUID.fromString(orderConfirmDto.getCartId()));
        return order;
    }

    public List<OrderDto> findAllOrdersByOwnerName(String username, LocalDate fromDate, LocalDate toDate, int page) {
        int total = 5;
        return orderDAO.findAllByOwnerUsername(username, fromDate, toDate, getPage(page, total), total).stream().map(OrderDto::new).collect(Collectors.toList());
    }

    public Optional<Order> findById(UUID id) {
        return orderDAO.findById(id);
    }

    public List<OrderDto> findAllOrders(LocalDate fromDate, LocalDate toDate, int page, String state) {
        int total = 5;
        return orderDAO.findAlL(fromDate, toDate, getPage(page, total), state, total).stream().map(OrderDto::new).collect(Collectors.toList());
    }

    @Transactional
    public void updateOrder(UUID orderId, String orderAddress, String orderState) {
        Order order = orderDAO.findById(orderId).get();
        if (orderState.equals("DELIVERED")) {
            order.setPaymentState(true);
        } else if (orderState.equals("RETURN")) {
            decrementProducts(order.getItems());
        }
        order.setOrderState(StateEnum.valueOf(orderState));
        order.setDeliveryMethode(orderAddress);
    }

    private void decrementProducts(List<OrderItem> items) {
        for (OrderItem i : items) {
            i.getProduct().incrementQuantityProduct((byte) i.getQuantity());
        }
    }

    public List<StatisticDto> getStatistic(String statisticName, LocalDate fromDate, LocalDate toDate) {
        return orderDAO.getStatistic(statisticName, fromDate, toDate).stream().map(StatisticDto::new).collect(Collectors.toList());
    }

    public List<ProductStatisticDto> getProductStatistic(LocalDate fromDate, LocalDate toDate) {
        return orderDAO.getProductStatistic( fromDate, toDate).stream().map(ProductStatisticDto::new).collect(Collectors.toList());
    }



    private int getPage(int page, int total) {
        if (page != 1) {
            page = (page - 1) * total + 1;
            return page - 1;
        }
        return 0;
    }
}
