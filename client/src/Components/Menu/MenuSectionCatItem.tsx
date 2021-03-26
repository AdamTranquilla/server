import React from "react";
import "./Menu.css";
import Option from "./MenuSectionCatItemOptions";
import { Accordion, AccordionBtn, AccordionContent } from "./Accordions";
import { addToCart } from "../../utils/cartStorage";
import { OrderContext } from "../../context/Order";
import socket from "../../utils/socket.io.js";
import Modal from "react-modal";
import SplitTable from "./SplitTable";
import { v4 as uuid } from "uuid";
interface OptionType {
  _id: String;
  name: String;
  price: Number;
}
interface ItemType {
  _id: String;
  name: String;
  price: Number;
  options: Array<OptionType>;
  preselect: Array<String>;
}
interface OptionOrderType {
  optionId: String;
  quantity?: Number;
  name: String;
  price: Number;
}

export default function Item({
  _id,
  name,
  price,
  options,
  preselect,
}: ItemType) {
  const [expanded, setExpanded] = React.useState<string | false>(`panel${_id}`);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedOptions, setOptions] = React.useState<OptionOrderType[]>([]);
  const context = React.useContext(OrderContext);
  const [showSplit, setShowSplit] = React.useState<boolean>(false);

  React.useEffect(() => {
    let preSelectedOptions = options.filter((option) => {
      return preselect && preselect?.indexOf(option._id) > -1;
    });

    preSelectedOptions.map((option) => {
      selectedOptions.push({
        name: option.name,
        optionId: option._id,
        quantity: 1,
        price: option.price,
      });
    });
  }, []);

  const customStyles = {
    content: {
      top: "50%",
      left: "50%",
      right: "auto",
      bottom: "auto",
      marginRight: "-50%",
      transform: "translate(-50%, -50%)",
    },
  };

  const editOption = ({ optionId, quantity, name, price }: OptionOrderType) => {
    if (typeof quantity === "undefined") {
      quantity = 0;
    }
    selectedOptions.push({ optionId, quantity, name, price });
  };

  const removeOption = (optionId: String) => {
    let index = -1;

    for (let i = 0; i < selectedOptions.length; i++) {
      if (selectedOptions[i].optionId === optionId) {
        index = i;
        break;
      }
    }
    selectedOptions.splice(index, 1);
    setOptions([...selectedOptions]);
  };

  const add = (seatIds: Number[]) => {
    let orderItem = {
      itemId: _id,
      cartItemId: uuid(),
      quantity,
      options: selectedOptions,
      seatId: seatIds,
      name,
      price,
      preselect,
    };
    if (seatIds.indexOf(context?.seatNo || -1) > -1) {
      addToCart(orderItem);
      context?.setItems("ADD_ITEM", orderItem);
    }
    setQuantity(1);
    socket.emit("split_bill", {
      item: orderItem,
      splitBy: context?.seatNo,
      tableNo: context?.tableNo,
    });
    alert("Added to cart");
  };

  const handleChange = (panel: string) => (
    event: React.ChangeEvent<{}>,
    newExpanded: boolean
  ) => {
    setExpanded(newExpanded ? panel : false);
  };
  return (
    <div /* className="item-container" */>
      <Modal isOpen={showSplit} style={customStyles}>
        <SplitTable
          preSelect={context?.seatNo}
          onClick={(seats: Number[]) => {
            setShowSplit(false);
            add(seats);
          }}
        />
      </Modal>

      <Accordion square onChange={handleChange(`panel${_id}`)}>
        <AccordionBtn aria-controls="panel${id}-content">
          <h3 style={{ margin: 0, marginBottom: 5 }}>{name}</h3>
          <h3 style={{ margin: 0, marginBottom: 5 }}>${price}</h3>
          <button className="btn" onClick={() => setShowSplit(true)}>
            Add to Order
          </button>
        </AccordionBtn>
        <AccordionContent>
          <div className="option-container">
            {options.map((option) => {
              return (
                <Option
                  _id={option._id}
                  name={option.name}
                  price={option.price}
                  editOption={editOption}
                  removeOption={removeOption}
                  isSelected={
                    preselect?.indexOf
                      ? preselect?.indexOf(option._id) > -1
                      : false
                  }
                />
              );
            })}
          </div>
        </AccordionContent>
      </Accordion>
    </div>
  );
}
