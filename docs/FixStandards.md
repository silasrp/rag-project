# FIX Family of Standards

Kevin Houston, Chairman Rapid Addition,

## Standards Matter

Interoperability, Quality, Economies of Scale, MEasurament of Information, Innovation, Transparency, Growth

- 485billions of dollars yearly spent on IT in 2014 (bamking and securities institutions)

## FIX Tag Value

- Release 1994
- Infomration about enhancements on fixtradingcommunity.org/pg/extension-pack
- Tag and Value how we communicate
  - Composed of four parts
    - Tag
      - FIX Field tagNumber
    - \=
    - Value
    - Delimiter

## FIXML

- Same information enclosed in a XML format
  - Started with DTD
  - Migrated to XSD schema
  - Reduction in size
    - Elements only for objects
  - Derivatives clearing

FIX Repository

- Data Model that describes FIX messages
  - Allow us to generate
    - FIX spec message tables
    - Data Dictionary
    - FIXimate
    - FIXWiki
    - Sxhema

## Pre trade - the idea

- Sell side communicates with bull side saying that wants to buy/sellsomething.
- Buy side checks if it does match a current trade on the database.

## The Trade

- Sell side sends order message
- Buy side acknowledges it
- Sell side sends an execution report

## Allocation

- Allocation instruction from Buy side to sell side
- Allocation ack from sell side
- Confirmation from sell side to buy side
- Confirmation ACK from buy side to sell side

## FIX Versions

- FIX Version 5.0 has support for everything
- 4.4 some support for foreign exchange

## FIX Repository Production

Composed of:

- Enums.xml
- Fields.xml
- Components.xml
- Messages.xml
- One more

## Standards Roadmap

To coordinate next steps

## FIXardlSM

- FIX Algorithmic Trading Definition Language
- Traditional method uses documents and custom code
- FIXatdsl
  - Vendor receives ATDL file form provider
  - File is imported into OMS
  - Vendor tests each screen with broker
  - Client is able to use it

## FAST

- Introduced in 2006
- Markets requested it
- Avoid transmitting redundant information
- Dogged by patent trolls, now in the clear
- Bandwith now is cheaper
- But still some good use cases

# Implementing FIX - Where do I find Online Resources?

Lucas Fowler, MACD

The power of FIX is that provides not only a standard template for messages but also a whole ecosystem of resources for many aspects of the onboarding or implementation process.

## Why FIX?

FIX = financial Information Exchange

- Communication standard protocol
- Open protocol
- Platform independent

## FIX Protocl Communication

- Independent of specific communications protocol(X.25, TCP/IP, MQ-Series)
  - Stream of bytes
  - Plain sockest or secure socket layer

## Why does FIX matter?

- Because trsnaction costs matter!!!
- Reduce costs and improve performance

## Benefits from using FIX

- Business flow perspective , FIX provides institutons and brokers a means of reduging clutter of unnecessary telephone calls and scraps of paper

## Resources Available

- FIX products and Vendors
  - Vendors also support the protocol with time and effort
- Technical/ Specifications
  - FIX specification
  - FIX version functionality matrix
  - FIX repository
  - User Defined fields
- FIXimate
- FIXWiki
- Forum

FIX Specification

- Don't rely only on FIXinmate
- Key features of the spec are often forgotten
  - Order State Change Matrixes (Appendix D - Volume 4)
  - Glossary - Volume 1
  - Post-Trade Messages - volume 5

## FPL Forum

- First stop for questions about FIX usage
- Please avoid re-inventing the wheel
- Use the discussion forums to discuss tags
- Search function will find partial words
- Re-Use User defined fields

## User Defined Fields

- Allow you to extended the FIX protocol
- Tag numbers 5000…9999 are reserved for User Defined Fields: full up!!!!
- Tag numbers 20000… are for internal use:
  - Within a single firm
  - No need to register/reserve
- Work hard to avoid user defined fields
  - Check the spec thoroughly
  - Discuus usage in thef orum
  - Re-use and help to update the standard

## FIX Repository

- Inforamtion extracted from the FIX specification in a more computer usable format
- All future releases os FIX will be generated this way
- Publicly available to FIX membership

## Construction

- There are a number of parts to the repository
  - Fields
  - Enumerations
  - Compnents
  - Messages - special tye of component
  - Message contents
- For each part of the repository are 4 parts

## Website fixtradingcommunity.org

- 3 Main tabs:
  - Tech/Steps
    - Bottom contains funciontality matrix
    - Application level specifications (versions differences)
    - When clicking in one of the versions, and going to the bottom of the page, it cements of a specific version
    - FIX 5.0 Specification Service Pack 2 are the most updated
    - FIX Presentation Layer and Session Layer
    - FIXimate
      - Interactive web browser based reference
    - FIXwiki
      - Wiki containing data from the FIX specification.
  - Discussions
    - Search on the top of the page
  - Guidelines
    - Lots of information
      - Beginners Guide, TEchinical Giudelines

Essential factors to consider when planning

## FIX implementation plan

- Establishing FIX connectivity
- Build or Buy
- Sizing the application to your requirements
- Don't underestimate network connectivity
  - How many session, multipliers, network provider
  - A FIX hub - supplies the whole interface management
- Don't underestimate Testing

## Rules of Engagment

- Eat your beans!
- Clarifies what you expect as well what you provide
- Acts as an FAQ for your counterparty
- Can be a checklist for the on-boarding process
- Keep your RoE up to date

## Testing

- Test all the asset classes
- Use test cases from the specifications

## Top Tips

- Agree comp ID's early and get heartbeating
- Make user logs readable

# FIX 101

## The Benefits of Standards

- Standrads generate efficiencies and competitiveness in the sectora that adopt them. A summary of the benfits:
  - Economies of Scale
  - Expanded Trading Possibilities

## Why have standards for Trading

- Less problems of compatibility issues
- Error reduction
  - Manual to electronic: no rekeying/transcription errors
  - Messaging standard such as FIX: no protocol conversion errors
  - Reference Data Standards: no message content errors
  - Business process standards
- Cost
  - Build once and use many
    - Millions saved in developments costs
  - Vendor neutral
  - IP certainty on all FX standards

## FIX is finished and I don't need anything

- No!!!
  - Trading is continuing evolving
  - Stan dards need to adjust constantly
  - FIX protocol is being updated every month
  - FIX started for equity trading between buyside and sellside
  - Now fully acroos asset, covering trade processing through to trade confirmation
  - Now used by market operators, clearing houses and regulators
  - Requires ongoing refinement and extension to cover more products and fl ows

## FIS Standards

- What is FIX protocol
  - The FIX protocol is a free and open messaging standard that was developed in 192 by Fidelity and Solomon Brothers to facilitate a bi-lateral communications framework for equities trading.
  - Since its conception, its usage has significantly expanded in response to evolving industry needs and today it is the predominant messaging standard for pre-trade and trade communication globally within the equity markets.
- How has it expanded
  - Started as equities trading standard, expanded horizantly acroos the asset classes to support derivatives, fixed income.

## FIX for Equituies and Derivatives

- 4.0: 1998
  - Basic Order Flow
  - IOI's and advertisement
  - Quotes
  - Some allocations
  - Some program trading
  - Some algorithmic trading
- Newest version is 5.0SP2
- Previous versions: 4.1, 4.2, 4.3, 4.4, 5.0, 5.0SP1
- The version of FIX itself defines who you can trade with and what asset classes you can trade;
- The most common versions in Europe 4.2, 4.4.

## FIX for Fixed Income and ForeingExchange

- 4.3:2001
- 4.4 is the most complete and likely version to trade Fixed income

## FIX for Markets and General Support

- Exchnages and Markets, General
  - News
  - Email
  - Regulatory Compliance

## Why does FIX matter?

- Because transactions costs matter
- Reduce costs and improve performance on the industry:
  - Regulators are pushing for transparency
  - Reduced equity returns force portfolio managers to control costs
  - Best execution is quickly becoming a key selection criteria for the end investor;

## Who uses FIX?

- Every major exchange, all the investment banks
- Buy side: mutual funds, hedge funds, etc
- Fixed Income and OTC platforms
- Listed derivative market
- Regulatory bodies for reporting

## Where does FIX fit in?

- Between the Asset Manager (Buy-side connectivity) and the broker-dealer(Broker connectivity), and then between the Broker-dealer(Market Access) and the Market (Exchange Connectivity);

## How the Fix protocol works?

- FIX fields ("Tag=VAllue"sintax)
  - &lt;TAG&gt;=&lt;VALUE&gt;&lt;DELIMITER&gt;
    - "8=FIX4.1^
- FIX - Three Standards in one
  - Business Semantic Model
    - Flows for trading allocation, confirmation, position management, etc.
    - Agreed defintions of order, order type, orders tate, etc.
  - Session definition - how a conversation takes place
  - Encoding - what the message looks like

## Other FIX standards

- Fixatdl
  - Enables algorithmic stragety providers to release specifications to clients in a computer readable XML format, as opposed to the traditional method of supplying detailed documentation coupled with considerable programming and testing.
    - The tradition method uses specification documents and cutom code
  - Benefits
    - Fix things on the fly
    - Quckker access to innovative new algorithmic trading strategies
    - OMS vendros are able to include new algorithms in their sstems in a more timely manner and at a reduced cost
- MMT - Model Market Typology
  - It is a standard for trade condition codes