import ConnectWallet from "./components/wallet/ConnectWallet";
import WalletInfo from "./components/wallet/WalletInfo";
import FaucetButton from "./components/faucet/FaucetButton";
import PChainFaucet from "./components/faucet/PChainFaucet";
import CreateWorkshop from "./components/workshop/CreateWorkshop";
import WorkshopList from "./components/workshop/WorkshopList";

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <h1>FPT Workshop</h1>
          <p className="muted">Check-in workshop on-chain</p>
        </div>

        <div className="header-actions">
          <ConnectWallet />
          <div className="faucet-actions">
            <FaucetButton />
            <PChainFaucet />
          </div>
          <WalletInfo />
        </div>
      </header>

      <main className="app-main">
        <CreateWorkshop />

        <section className="workshop-section">
          <h2>Danh sách Workshop</h2>
          <WorkshopList />
        </section>
      </main>
    </div>
  );
}

export default App;
